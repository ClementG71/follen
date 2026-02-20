# Backend Wagtail — Modèles, Blocks & Serializers

> Cahier des charges technique pour le développeur backend.
> Ce document décrit l'ensemble des modèles Wagtail, blocs StreamField, serializers DRF et endpoints API nécessaires pour alimenter le frontend Astro SSG.

---

## Table des matières

1. [Architecture générale](#architecture-générale)
2. [Correspondance Front / Back](#correspondance-front--back)
3. [blocks.py — StreamField Blocks](#blockspy--streamfield-blocks)
4. [models.py — Modèles Wagtail](#modelspy--modèles-wagtail)
5. [serializers.py — Serializers DRF](#serializerspy--serializers-drf)
6. [api.py — Configuration API & Endpoints](#apipy--configuration-api--endpoints)
7. [urls.py — Routage](#urlspy--routage)
8. [Notes d'implémentation](#notes-dimplémentation)

---

## Architecture générale

```
Frontend (Astro SSG)          Backend (Wagtail headless)
─────────────────────         ─────────────────────────
src/lib/api.ts          ───►  /api/v2/pages/
src/pages/index.astro   ───►  HomePage (api_fields)
src/pages/[slug].astro  ───►  SectorPage / FormPage / StaticPage
src/pages/blog/[slug]   ───►  ArticlePage
composants Astro        ───►  StreamField blocks sérialisés en JSON
DynamicForm.astro       ───►  /api/v2/forms/submit/<id>/
DoubleNavbar.astro      ───►  /api/navigation/
Footer.astro            ───►  /api/settings/
Newsletter.astro        ───►  /api/newsletter/ (POST)
```

---

## Correspondance Front / Back

| Frontend (Astro)                  | Modèle Wagtail        | Endpoint API                              |
| --------------------------------- | --------------------- | ----------------------------------------- |
| `index.astro`                     | `HomePage`            | `/api/v2/pages/?type=blog.HomePage`       |
| `agriculture.astro` / `[slug]`    | `SectorPage`          | `/api/sectors/<slug>/`                    |
| `blog/[slug].astro`               | `ArticlePage`         | `/api/v2/pages/?type=blog.ArticlePage`    |
| `adhesion.astro`                  | `AdhesionPage`        | `/api/v2/pages/?type=blog.AdhesionPage`   |
| `archives.astro`                  | `ArchivePage`         | `/api/v2/pages/?type=blog.ArchivePage`    |
| `revendications.astro`            | `RevendicationPage`   | `/api/v2/pages/?type=blog.RevendicationPage` |
| `instances.astro`                 | `InstancePage`        | `/api/v2/pages/?type=blog.InstancePage`   |
| `contact.astro`                   | `ContactPage`         | `/api/v2/pages/?type=blog.ContactPage`    |
| `ActionCardsSection.astro`        | `ActionCardBlock`     | Inclus dans les pages (StreamField)       |
| `Newsletter.astro`                | Champs `newsletter_*` | `/api/newsletter/` (POST)                 |
| `Footer.astro`                    | `settings_api`        | `/api/settings/`                          |
| `ContactBanner.astro`             | `RepresentativeBlock` | Inclus dans les pages (StreamField)       |
| `InstitutionalLinks.astro`        | `InstitutionalLinkBlock` | Inclus dans HomePage                   |
| `ScrollSnapCarousel.astro`        | `HeroSlideBlock`      | Inclus dans HomePage (`hero_articles_list`) |
| `NewsFeed.astro`                  | computed property     | Inclus dans HomePage (`latest_articles_list`) |
| Instance news aside               | computed property     | Inclus dans SectorPage (`news_instance_list`) |
| `DynamicForm.astro`               | `form_fields_data`    | `/api/v2/forms/submit/<id>/`              |
| `DoubleNavbar.astro`              | `navigation_api`      | `/api/navigation/`                        |

---

## blocks.py — StreamField Blocks

```python
# blog/blocks.py
from wagtail.blocks import (
    CharBlock, TextBlock, RichTextBlock, URLBlock, EmailBlock,
    ChoiceBlock, StructBlock, ListBlock, StreamBlock, PageChooserBlock,
)
from wagtail.images.blocks import ImageChooserBlock
from wagtail.embeds.blocks import EmbedBlock


# ─── Composant Boutons Liens (InstitutionalLinks) ──────────────────────────
class InstitutionalLinkBlock(StructBlock):
    label = CharBlock(required=True, max_length=100)
    href = URLBlock(required=True)
    icon = ChoiceBlock(choices=[
        ('external', 'Lien externe'),
        ('internal', 'Lien interne'),
        ('pdf', 'Document PDF'),
    ], default='external')
    color = ChoiceBlock(choices=[
        ('blue', 'Bleu'),
        ('red', 'Rouge'),
        ('slate', 'Gris'),
    ], default='blue')

    class Meta:
        icon = 'link'
        label = 'Lien institutionnel'


# ─── Composant Cards (ActionCards) ──────────────────────────────────────────
class ActionCardBlock(StructBlock):
    title = CharBlock(required=True, max_length=120)
    description = TextBlock(required=True)
    icon_name = ChoiceBlock(choices=[
        ('handshake', 'Poignée de main'),
        ('book', 'Livre'),
        ('mail', 'Courrier'),
        ('wrench', 'Outil'),
        ('users', 'Utilisateurs'),
        ('heart', 'Cœur'),
        ('leaf', 'Feuille'),
        ('megaphone', 'Mégaphone'),
    ], default='book')
    link = URLBlock(required=False)
    link_text = CharBlock(required=False, max_length=80, default='En savoir plus')

    class Meta:
        icon = 'doc-full'
        label = "Carte d'action"


# ─── Composant Représentants ────────────────────────────────────────────────
class RepresentativeBlock(StructBlock):
    name = CharBlock(required=True, max_length=120)
    role = CharBlock(required=True, max_length=200)
    photo = ImageChooserBlock(required=False)
    email = EmailBlock(required=False)
    phone = CharBlock(required=False, max_length=20)

    class Meta:
        icon = 'user'
        label = 'Représentant'


# ─── Composant Slider (Articles Hero) ──────────────────────────────────────
class HeroSlideBlock(StructBlock):
    page = PageChooserBlock(
        required=False, page_type='blog.ArticlePage'
    )
    title_override = CharBlock(
        required=False, max_length=200,
        help_text="Laisser vide pour utiliser le titre de l'article",
    )
    excerpt_override = TextBlock(
        required=False,
        help_text="Laisser vide pour utiliser le chapeau de l'article",
    )
    image_override = ImageChooserBlock(
        required=False,
        help_text="Laisser vide pour utiliser l'image de l'article",
    )
    category_override = CharBlock(required=False, max_length=80)

    class Meta:
        icon = 'image'
        label = 'Slide Hero'


# ─── Composant Ressources ──────────────────────────────────────────────────
class ResourceBlock(StructBlock):
    title = CharBlock(required=True, max_length=120)
    description = TextBlock(required=True)
    icon_name = ChoiceBlock(choices=[
        ('book', 'Livre'),
        ('wrench', 'Outil'),
        ('users', 'Groupe'),
        ('heart', 'Cœur'),
        ('pdf', 'Document'),
    ], default='book')
    file = URLBlock(required=False, help_text='Lien vers le document ou la page')
    link_text = CharBlock(required=False, max_length=80, default='Consulter')

    class Meta:
        icon = 'folder-open-inverse'
        label = 'Ressource'


# ─── Revendications (Thématiques Accordéon) ─────────────────────────────────
class RevendicationThemeBlock(StructBlock):
    title = CharBlock(required=True, max_length=200)
    short_title = CharBlock(required=True, max_length=50)
    icon_svg = TextBlock(required=False, help_text="SVG inline de l'icône")
    content = ListBlock(TextBlock(), label='Paragraphes')
    pdf_url = URLBlock(required=False, help_text='Lien vers la fiche PDF')

    class Meta:
        icon = 'list-ul'
        label = 'Thématique'


# ─── Instance News Item ─────────────────────────────────────────────────────
class InstanceNewsItemBlock(StructBlock):
    page = PageChooserBlock(required=False, page_type='blog.ArticlePage')
    title = CharBlock(required=True, max_length=300)
    date = CharBlock(required=True, max_length=20)
    instance_type = ChoiceBlock(choices=[
        ('CT', 'Comité Technique'),
        ('CAP', 'CAP'),
        ('CHSCT', 'CHSCT / F-SST'),
        ('CSA', 'CSA'),
        ('Autre', 'Autre'),
    ])
    href = URLBlock(required=False)

    class Meta:
        icon = 'doc-empty'
        label = "Actualité d'instance"


# ─── Contact Info Block ─────────────────────────────────────────────────────
class ContactInfoBlock(StructBlock):
    address_line_1 = CharBlock(required=True, max_length=200)
    address_line_2 = CharBlock(required=False, max_length=200)
    phone = CharBlock(required=False, max_length=20)
    email = EmailBlock(required=False)
    opening_hours = CharBlock(required=False, max_length=200)

    class Meta:
        icon = 'site'
        label = 'Coordonnées'


# ─── Corps d'article (StreamField principal) ────────────────────────────────
class BodyStreamBlock(StreamBlock):
    paragraph = RichTextBlock(icon='pilcrow', label='Paragraphe')
    heading = StructBlock([
        ('text', CharBlock(required=True)),
        ('size', ChoiceBlock(choices=[
            ('2', 'H2'), ('3', 'H3'), ('4', 'H4'),
        ], default='3')),
    ], icon='title', label='Titre')
    image = ImageChooserBlock(icon='image', label='Image')
    quote = StructBlock([
        ('text', RichTextBlock(required=True)),
        ('attribution', CharBlock(required=False, max_length=200)),
    ], icon='openquote', label='Citation')
    embed = EmbedBlock(icon='media', label='Média embarqué')
    raw_html = TextBlock(icon='code', label='HTML brut')
    bullet_list = ListBlock(
        RichTextBlock(), icon='list-ul', label='Liste à puces'
    )
    ordered_list = ListBlock(
        RichTextBlock(), icon='list-ol', label='Liste numérotée'
    )
    link_block = StructBlock([
        ('text', CharBlock(required=True, max_length=200)),
        ('url', URLBlock(required=True)),
        ('is_external', ChoiceBlock(choices=[
            ('true', 'Externe'), ('false', 'Interne'),
        ], default='false')),
    ], icon='link', label='Lien')

    class Meta:
        icon = 'doc-full'
```

---

## models.py — Modèles Wagtail

```python
# blog/models.py
from django.db import models
from modelcluster.fields import ParentalKey, ParentalManyToManyField
from modelcluster.contrib.taggit import ClusterTaggableManager
from taggit.models import TaggedItemBase

from wagtail.models import Page, Orderable
from wagtail.fields import RichTextField, StreamField
from wagtail.admin.panels import (
    FieldPanel, InlinePanel, MultiFieldPanel, TabbedInterface, ObjectList,
)
from wagtail.api import APIField
from wagtail.images.api.fields import ImageRenditionField
from wagtail.contrib.forms.models import AbstractFormField, AbstractFormPage
from wagtail.snippets.models import register_snippet

from .blocks import (
    BodyStreamBlock, ActionCardBlock, RepresentativeBlock,
    InstitutionalLinkBlock, HeroSlideBlock, ResourceBlock,
    RevendicationThemeBlock, InstanceNewsItemBlock, ContactInfoBlock,
)
from .serializers import (
    ArticleSummarySerializer, ArticleNewsFeedSerializer,
    RepresentativeBlockSerializer, InstanceNewsSerializer,
    HeroSlideSerializer, FormFieldSerializer, TagSerializer,
    RevendicationThemeSerializer, ContactInfoSerializer,
)


# ═══════════════════════════════════════════════════════════════════════════
# SNIPPETS
# ═══════════════════════════════════════════════════════════════════════════

@register_snippet
class ArticleCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, null=True)

    panels = [
        FieldPanel('name'),
        FieldPanel('slug'),
        FieldPanel('icon'),
    ]

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Catégorie d'article"
        verbose_name_plural = "Catégories d'articles"


@register_snippet
class InstanceType(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    color_class = models.CharField(
        max_length=100, blank=True,
        help_text="Classe CSS pour le badge (ex: bg-blue-100 text-blue-800)",
    )

    panels = [
        FieldPanel('name'),
        FieldPanel('slug'),
        FieldPanel('color_class'),
    ]

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Type d'instance"
        verbose_name_plural = "Types d'instances"


# ═══════════════════════════════════════════════════════════════════════════
# TAGS
# ═══════════════════════════════════════════════════════════════════════════

class ArticlePageTag(TaggedItemBase):
    content_object = ParentalKey(
        'ArticlePage',
        related_name='tagged_items',
        on_delete=models.CASCADE,
    )


# ═══════════════════════════════════════════════════════════════════════════
# PAGE ACCUEIL (HomePage)
# ═══════════════════════════════════════════════════════════════════════════

class HomePage(Page):
    hero_slides = StreamField(
        [('slide', HeroSlideBlock())],
        blank=True, use_json_field=True,
        verbose_name='Slides du carrousel Hero',
    )
    institutional_links = StreamField(
        [('link', InstitutionalLinkBlock())],
        blank=True, use_json_field=True,
        verbose_name='Liens institutionnels',
    )
    news_feed_title = models.CharField(max_length=100, default='Actualités')
    news_feed_count = models.PositiveIntegerField(default=12)
    action_cards = StreamField(
        [('card', ActionCardBlock())],
        blank=True, use_json_field=True,
        verbose_name="Cartes d'action",
    )
    newsletter_title = models.CharField(max_length=100, default='Restez informé')
    newsletter_description = models.TextField(blank=True)

    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('hero_slides'),
        ], heading='Carrousel Hero'),
        FieldPanel('institutional_links'),
        MultiFieldPanel([
            FieldPanel('news_feed_title'),
            FieldPanel('news_feed_count'),
        ], heading="Fil d'actualités"),
        FieldPanel('action_cards'),
        MultiFieldPanel([
            FieldPanel('newsletter_title'),
            FieldPanel('newsletter_description'),
        ], heading='Newsletter'),
    ]

    subpage_types = [
        'blog.ArticlePage', 'blog.SectorPage',
        'blog.ArchivePage', 'blog.RevendicationPage',
        'blog.InstancePage', 'blog.AdhesionPage',
        'blog.ContactPage', 'blog.StaticPage',
    ]

    @property
    def hero_articles_list(self):
        """Résout les slides en articles complets pour le carrousel."""
        slides = []
        for block in self.hero_slides:
            data = block.value
            page = data.get('page')
            if page and hasattr(page.specific, 'header_image'):
                article = page.specific
                img = (
                    data.get('image_override')
                    or getattr(article, 'header_image', None)
                )
                slides.append({
                    'id': article.pk,
                    'title': data.get('title_override') or article.title,
                    'excerpt': (
                        data.get('excerpt_override')
                        or getattr(article, 'excerpt', '')
                    ),
                    'image': (
                        img.get_rendition('fill-1920x700').url if img else ''
                    ),
                    'href': article.url,
                    'category': data.get('category_override') or (
                        article.category.name
                        if hasattr(article, 'category') and article.category
                        else ''
                    ),
                })
            else:
                slides.append({
                    'id': 0,
                    'title': data.get('title_override', ''),
                    'excerpt': data.get('excerpt_override', ''),
                    'image': '',
                    'href': '#',
                    'category': data.get('category_override', ''),
                })
        return slides

    @property
    def latest_articles_list(self):
        """Derniers articles publiés pour le NewsFeed."""
        articles = (
            ArticlePage.objects.live().public()
            .order_by('-date', '-first_published_at')
            [:self.news_feed_count]
        )
        return [
            {
                'id': a.pk,
                'title': a.title,
                'date': a.date.isoformat() if a.date else '',
                'category': a.category.name if a.category else '',
                'href': a.url,
                'thumbnail': (
                    a.header_image.get_rendition('fill-48x48').url
                    if a.header_image else None
                ),
            }
            for a in articles
        ]

    api_fields = [
        APIField('hero_articles_list'),
        APIField('institutional_links'),
        APIField('news_feed_title'),
        APIField('latest_articles_list'),
        APIField('action_cards'),
        APIField('newsletter_title'),
        APIField('newsletter_description'),
    ]

    class Meta:
        verbose_name = "Page d'accueil"


# ═══════════════════════════════════════════════════════════════════════════
# PAGES ARTICLES (ArticlePage)
# ═══════════════════════════════════════════════════════════════════════════

class ArticlePage(Page):
    date = models.DateField('Date de publication')
    author = models.CharField(max_length=200, blank=True)
    sector = models.CharField(max_length=20, choices=[
        ('agriculture', 'Agriculture'),
        ('ecologie', 'Écologie'),
        ('interieur', 'Intérieur'),
        ('general', 'Général'),
    ], default='general')
    excerpt = models.TextField(
        'Extrait / Chapeau court', max_length=500, blank=True,
    )
    introduction = models.TextField('Introduction longue', blank=True)
    header_image = models.ForeignKey(
        'wagtailimages.Image', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+',
        verbose_name='Image à la une',
    )
    category = models.ForeignKey(
        'ArticleCategory', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+',
        verbose_name='Catégorie',
    )
    instance_type = models.ForeignKey(
        'InstanceType', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+',
        verbose_name="Type d'instance",
        help_text="Remplir uniquement pour les articles liés à une instance",
    )
    body = StreamField(
        BodyStreamBlock(), use_json_field=True,
        verbose_name="Corps de l'article",
    )
    tags = ClusterTaggableManager(through=ArticlePageTag, blank=True)

    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('date'),
            FieldPanel('author'),
            FieldPanel('sector'),
            FieldPanel('category'),
            FieldPanel('instance_type'),
        ], heading='Métadonnées'),
        FieldPanel('header_image'),
        FieldPanel('excerpt'),
        FieldPanel('introduction'),
        FieldPanel('body'),
        FieldPanel('tags'),
    ]

    parent_page_types = ['blog.HomePage', 'blog.SectorPage']

    @property
    def header_image_url(self):
        if self.header_image:
            return self.header_image.get_rendition('fill-1600x700').url
        return None

    @property
    def header_image_thumbnail(self):
        if self.header_image:
            return self.header_image.get_rendition('fill-400x240').url
        return None

    @property
    def category_info(self):
        if self.category:
            return {
                'name': self.category.name,
                'slug': self.category.slug,
                'icon': self.category.icon,
            }
        return None

    @property
    def tags_list(self):
        return [tag.name for tag in self.tags.all()]

    api_fields = [
        APIField('date'),
        APIField('author'),
        APIField('sector'),
        APIField('excerpt'),
        APIField('introduction'),
        APIField('body'),
        APIField('header_image_url'),
        APIField('header_image_thumbnail'),
        APIField('category_info'),
        APIField('tags_list'),
        APIField('instance_type'),
    ]

    class Meta:
        verbose_name = 'Article'
        ordering = ['-date', '-first_published_at']


# ═══════════════════════════════════════════════════════════════════════════
# PAGE STRUCTURES / SECTEURS (SectorPage)
# ═══════════════════════════════════════════════════════════════════════════

class SectorPage(Page):
    color_theme = models.CharField(max_length=10, choices=[
        ('green', 'Vert (Agriculture)'),
        ('blue', 'Bleu (Écologie)'),
        ('yellow', 'Jaune (Intérieur)'),
        ('red', 'Rouge (Général)'),
    ], default='green')
    context_banner_text = models.CharField(
        max_length=300, blank=True,
        verbose_name='Texte du bandeau contextuel',
    )
    sector_key = models.CharField(max_length=20, choices=[
        ('agriculture', 'Agriculture'),
        ('ecologie', 'Écologie'),
        ('interieur', 'Intérieur'),
    ], help_text='Clé du secteur pour filtrer les articles')
    actions = StreamField(
        [('card', ActionCardBlock()), ('resource', ResourceBlock())],
        blank=True, use_json_field=True,
        verbose_name="Cartes d'action / Ressources",
    )
    representatives = StreamField(
        [('representative', RepresentativeBlock())],
        blank=True, use_json_field=True,
        verbose_name='Représentants',
    )
    instance_news = StreamField(
        [('item', InstanceNewsItemBlock())],
        blank=True, use_json_field=True,
        verbose_name='Fil des actualités des instances',
    )
    newsletter_title = models.CharField(max_length=100, blank=True)
    newsletter_description = models.TextField(blank=True)
    newsletter_history_link = models.URLField(blank=True)

    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('color_theme'),
            FieldPanel('context_banner_text'),
            FieldPanel('sector_key'),
        ], heading='Configuration du secteur'),
        FieldPanel('actions'),
        FieldPanel('representatives'),
        FieldPanel('instance_news'),
        MultiFieldPanel([
            FieldPanel('newsletter_title'),
            FieldPanel('newsletter_description'),
            FieldPanel('newsletter_history_link'),
        ], heading='Newsletter secteur'),
    ]

    parent_page_types = ['blog.HomePage']
    subpage_types = ['blog.ArticlePage']

    @property
    def news_general_list(self):
        """Actualités générales : articles du secteur + articles généraux."""
        articles = (
            ArticlePage.objects.live().public()
            .filter(sector__in=[self.sector_key, 'general'])
            .exclude(instance_type__isnull=False)
            .order_by('-date')[:4]
        )
        return [
            {
                'id': a.pk,
                'title': a.title,
                'date': a.date.isoformat() if a.date else '',
                'thumbnail': a.header_image_thumbnail or '',
                'href': a.url,
                'category': a.category.name if a.category else '',
            }
            for a in articles
        ]

    @property
    def news_instance_list(self):
        """Actualités des instances pour ce secteur."""
        articles = (
            ArticlePage.objects.live().public()
            .filter(sector=self.sector_key, instance_type__isnull=False)
            .order_by('-date')[:5]
        )
        return [
            {
                'id': a.pk,
                'title': a.title,
                'date': a.date.isoformat() if a.date else '',
                'type': a.instance_type.name if a.instance_type else 'Autre',
                'href': a.url,
            }
            for a in articles
        ]

    @property
    def representatives_list(self):
        """Sérialise les représentants pour l'API."""
        result = []
        for block in self.representatives:
            data = block.value
            photo = data.get('photo')
            result.append({
                'name': data.get('name', ''),
                'role': data.get('role', ''),
                'photo_url': (
                    photo.get_rendition('fill-128x128').url if photo else ''
                ),
                'email': data.get('email', ''),
                'phone': data.get('phone', ''),
            })
        return result

    api_fields = [
        APIField('color_theme'),
        APIField('context_banner_text'),
        APIField('sector_key'),
        APIField('news_general_list'),
        APIField('news_instance_list'),
        APIField('representatives_list'),
        APIField('actions'),
        APIField('instance_news'),
        APIField('newsletter_title'),
        APIField('newsletter_description'),
        APIField('newsletter_history_link'),
    ]

    class Meta:
        verbose_name = 'Page Secteur'
        verbose_name_plural = 'Pages Secteur'


# ═══════════════════════════════════════════════════════════════════════════
# PAGE ADHÉSION (AdhesionPage — basée sur FormPage)
# ═══════════════════════════════════════════════════════════════════════════

class AdhesionFormField(AbstractFormField):
    page = ParentalKey(
        'AdhesionPage', on_delete=models.CASCADE,
        related_name='form_fields',
    )


class AdhesionPage(AbstractFormPage):
    intro = RichTextField(blank=True, verbose_name='Introduction')
    thank_you_text = RichTextField(
        blank=True, verbose_name='Message de confirmation',
    )
    pdf_bulletin_url = models.URLField(
        blank=True, verbose_name='URL du bulletin PDF',
        help_text="Lien vers le bulletin d'adhésion téléchargeable",
    )
    pdf_section_title = models.CharField(
        max_length=200, default='Par voie postale', blank=True,
    )
    pdf_section_description = models.TextField(blank=True)
    cotisation_info_title = models.CharField(
        max_length=200, default='À propos de la cotisation', blank=True,
    )
    cotisation_info_text = models.TextField(blank=True)
    newsletter_title = models.CharField(
        max_length=100, blank=True, default='Rejoignez notre communauté',
    )
    newsletter_description = models.TextField(blank=True)

    content_panels = AbstractFormPage.content_panels + [
        FieldPanel('intro'),
        MultiFieldPanel([
            FieldPanel('pdf_section_title'),
            FieldPanel('pdf_section_description'),
            FieldPanel('pdf_bulletin_url'),
        ], heading='Section bulletin PDF'),
        InlinePanel('form_fields', label='Champs du formulaire'),
        FieldPanel('thank_you_text'),
        MultiFieldPanel([
            FieldPanel('cotisation_info_title'),
            FieldPanel('cotisation_info_text'),
        ], heading='Info cotisation'),
        MultiFieldPanel([
            FieldPanel('newsletter_title'),
            FieldPanel('newsletter_description'),
        ], heading='Newsletter'),
    ]

    parent_page_types = ['blog.HomePage']

    @property
    def form_fields_data(self):
        """Sérialise les champs pour l'API."""
        return [
            {
                'id': str(field.pk),
                'clean_name': field.clean_name,
                'label': field.label,
                'field_type': field.field_type,
                'required': field.required,
                'choices': field.choices,
                'help_text': field.help_text,
                'default_value': field.default_value,
            }
            for field in self.form_fields.all()
        ]

    api_fields = [
        APIField('intro'),
        APIField('thank_you_text'),
        APIField('form_fields_data'),
        APIField('pdf_bulletin_url'),
        APIField('pdf_section_title'),
        APIField('pdf_section_description'),
        APIField('cotisation_info_title'),
        APIField('cotisation_info_text'),
        APIField('newsletter_title'),
        APIField('newsletter_description'),
    ]

    class Meta:
        verbose_name = "Page d'adhésion"


# ═══════════════════════════════════════════════════════════════════════════
# PAGE ARCHIVES (ArchivePage)
# ═══════════════════════════════════════════════════════════════════════════

class ArchivePage(Page):
    intro = RichTextField(blank=True, verbose_name='Introduction')
    articles_per_page = models.PositiveIntegerField(default=12)
    newsletter_title = models.CharField(max_length=100, blank=True)
    newsletter_description = models.TextField(blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('intro'),
        FieldPanel('articles_per_page'),
        MultiFieldPanel([
            FieldPanel('newsletter_title'),
            FieldPanel('newsletter_description'),
        ], heading='Newsletter'),
    ]

    parent_page_types = ['blog.HomePage']

    @property
    def all_tags(self):
        """Tous les tags utilisés dans les articles (pour le nuage)."""
        from taggit.models import Tag
        article_ids = (
            ArticlePage.objects.live().public()
            .values_list('pk', flat=True)
        )
        return list(
            Tag.objects.filter(
                blog_articlepagetag_items__content_object_id__in=article_ids
            )
            .distinct()
            .values_list('name', flat=True)
        )

    @property
    def articles_list(self):
        """Articles paginés pour la grille."""
        articles = (
            ArticlePage.objects.live().public()
            .order_by('-date')[:self.articles_per_page]
        )
        return [
            {
                'id': a.pk,
                'title': a.title,
                'date': a.date.isoformat() if a.date else '',
                'category': a.category.name if a.category else '',
                'excerpt': a.excerpt,
                'image': a.header_image_thumbnail or '',
                'href': a.url,
            }
            for a in articles
        ]

    api_fields = [
        APIField('intro'),
        APIField('articles_per_page'),
        APIField('all_tags'),
        APIField('articles_list'),
        APIField('newsletter_title'),
        APIField('newsletter_description'),
    ]

    class Meta:
        verbose_name = 'Page Archives'


# ═══════════════════════════════════════════════════════════════════════════
# PAGE REVENDICATIONS (RevendicationPage)
# ═══════════════════════════════════════════════════════════════════════════

class RevendicationPage(Page):
    intro = RichTextField(blank=True, verbose_name='Introduction')
    themes = StreamField(
        [('theme', RevendicationThemeBlock())],
        blank=True, use_json_field=True,
        verbose_name='Thématiques',
    )
    cta_title = models.CharField(
        max_length=200, blank=True,
        default='Vous partagez nos valeurs ?',
    )
    cta_description = models.TextField(blank=True)
    cta_button_text = models.CharField(
        max_length=100, blank=True, default='Adhérer maintenant',
    )
    cta_button_link = models.URLField(blank=True, default='/adhesion')
    newsletter_title = models.CharField(max_length=100, blank=True)
    newsletter_description = models.TextField(blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('intro'),
        FieldPanel('themes'),
        MultiFieldPanel([
            FieldPanel('cta_title'),
            FieldPanel('cta_description'),
            FieldPanel('cta_button_text'),
            FieldPanel('cta_button_link'),
        ], heading='CTA Adhésion'),
        MultiFieldPanel([
            FieldPanel('newsletter_title'),
            FieldPanel('newsletter_description'),
        ], heading='Newsletter'),
    ]

    parent_page_types = ['blog.HomePage']

    api_fields = [
        APIField('intro'),
        APIField('themes'),
        APIField('cta_title'),
        APIField('cta_description'),
        APIField('cta_button_text'),
        APIField('cta_button_link'),
        APIField('newsletter_title'),
        APIField('newsletter_description'),
    ]

    class Meta:
        verbose_name = 'Page Revendications'


# ═══════════════════════════════════════════════════════════════════════════
# PAGE INSTANCES (InstancePage)
# ═══════════════════════════════════════════════════════════════════════════

class InstancePage(Page):
    intro = RichTextField(blank=True)
    articles_per_page = models.PositiveIntegerField(default=8)
    newsletter_title = models.CharField(max_length=100, blank=True)
    newsletter_description = models.TextField(blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('intro'),
        FieldPanel('articles_per_page'),
        MultiFieldPanel([
            FieldPanel('newsletter_title'),
            FieldPanel('newsletter_description'),
        ], heading='Newsletter'),
    ]

    parent_page_types = ['blog.HomePage']

    @property
    def instance_types_list(self):
        """Types d'instances disponibles (pour les filtres)."""
        return list(
            InstanceType.objects.all()
            .values('id', 'name', 'slug', 'color_class')
        )

    @property
    def articles_list(self):
        """Articles liés aux instances."""
        articles = (
            ArticlePage.objects.live().public()
            .filter(instance_type__isnull=False)
            .select_related('instance_type', 'header_image')
            .order_by('-date')[:self.articles_per_page]
        )
        return [
            {
                'id': a.pk,
                'title': a.title,
                'instance': (
                    a.instance_type.name if a.instance_type else ''
                ),
                'instance_slug': (
                    a.instance_type.slug if a.instance_type else ''
                ),
                'date': a.date.isoformat() if a.date else '',
                'excerpt': a.excerpt,
                'image': a.header_image_thumbnail or '',
                'href': a.url,
            }
            for a in articles
        ]

    api_fields = [
        APIField('intro'),
        APIField('articles_per_page'),
        APIField('instance_types_list'),
        APIField('articles_list'),
        APIField('newsletter_title'),
        APIField('newsletter_description'),
    ]

    class Meta:
        verbose_name = 'Page Instances'


# ═══════════════════════════════════════════════════════════════════════════
# PAGE CONTACT (ContactPage — basée sur FormPage)
# ═══════════════════════════════════════════════════════════════════════════

class ContactFormField(AbstractFormField):
    page = ParentalKey(
        'ContactPage', on_delete=models.CASCADE,
        related_name='form_fields',
    )


class ContactPage(AbstractFormPage):
    intro = RichTextField(blank=True)
    thank_you_text = RichTextField(blank=True)
    headquarters_title = models.CharField(
        max_length=200, default='Siège National', blank=True,
    )
    headquarters_address_1 = models.CharField(max_length=200, blank=True)
    headquarters_address_2 = models.CharField(max_length=200, blank=True)
    headquarters_phone = models.CharField(max_length=20, blank=True)
    headquarters_email = models.EmailField(blank=True)
    headquarters_hours = models.CharField(max_length=200, blank=True)
    representatives = StreamField(
        [('representative', RepresentativeBlock())],
        blank=True, use_json_field=True,
        verbose_name='Représentants régionaux',
    )
    newsletter_title = models.CharField(max_length=100, blank=True)
    newsletter_description = models.TextField(blank=True)

    content_panels = AbstractFormPage.content_panels + [
        FieldPanel('intro'),
        InlinePanel('form_fields', label='Champs du formulaire'),
        FieldPanel('thank_you_text'),
        MultiFieldPanel([
            FieldPanel('headquarters_title'),
            FieldPanel('headquarters_address_1'),
            FieldPanel('headquarters_address_2'),
            FieldPanel('headquarters_phone'),
            FieldPanel('headquarters_email'),
            FieldPanel('headquarters_hours'),
        ], heading='Coordonnées du siège'),
        FieldPanel('representatives'),
        MultiFieldPanel([
            FieldPanel('newsletter_title'),
            FieldPanel('newsletter_description'),
        ], heading='Newsletter'),
    ]

    parent_page_types = ['blog.HomePage']

    @property
    def form_fields_data(self):
        return [
            {
                'id': str(field.pk),
                'clean_name': field.clean_name,
                'label': field.label,
                'field_type': field.field_type,
                'required': field.required,
                'choices': field.choices,
                'help_text': field.help_text,
                'default_value': field.default_value,
            }
            for field in self.form_fields.all()
        ]

    @property
    def headquarters_info(self):
        return {
            'title': self.headquarters_title,
            'address_1': self.headquarters_address_1,
            'address_2': self.headquarters_address_2,
            'phone': self.headquarters_phone,
            'email': self.headquarters_email,
            'hours': self.headquarters_hours,
        }

    @property
    def representatives_list(self):
        result = []
        for block in self.representatives:
            data = block.value
            photo = data.get('photo')
            result.append({
                'name': data.get('name', ''),
                'role': data.get('role', ''),
                'photo_url': (
                    photo.get_rendition('fill-120x120').url if photo else ''
                ),
                'email': data.get('email', ''),
                'phone': data.get('phone', ''),
            })
        return result

    api_fields = [
        APIField('intro'),
        APIField('thank_you_text'),
        APIField('form_fields_data'),
        APIField('headquarters_info'),
        APIField('representatives_list'),
        APIField('newsletter_title'),
        APIField('newsletter_description'),
    ]

    class Meta:
        verbose_name = 'Page Contact'


# ═══════════════════════════════════════════════════════════════════════════
# PAGE STATIQUE GÉNÉRIQUE (StaticPage)
# ═══════════════════════════════════════════════════════════════════════════

class StaticPage(Page):
    header_image = models.ForeignKey(
        'wagtailimages.Image', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+',
    )
    content = StreamField(
        BodyStreamBlock(), blank=True, use_json_field=True,
    )

    content_panels = Page.content_panels + [
        FieldPanel('header_image'),
        FieldPanel('content'),
    ]

    parent_page_types = ['blog.HomePage']

    @property
    def header_image_url(self):
        if self.header_image:
            return self.header_image.get_rendition('fill-1600x700').url
        return None

    api_fields = [
        APIField('header_image_url'),
        APIField('content'),
    ]

    class Meta:
        verbose_name = 'Page statique'
```

---

## serializers.py — Serializers DRF

```python
# blog/serializers.py
from rest_framework import serializers


class ArticleSummarySerializer(serializers.Serializer):
    """Résumés d'articles (carrousel, news feed, grilles)."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    excerpt = serializers.CharField(required=False, allow_blank=True)
    date = serializers.CharField()
    category = serializers.CharField(required=False, allow_blank=True)
    href = serializers.CharField()
    image = serializers.CharField(required=False, allow_blank=True)
    thumbnail = serializers.CharField(required=False, allow_blank=True)


class ArticleNewsFeedSerializer(serializers.Serializer):
    """Format compact pour le fil d'actualités (NewsFeed)."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    date = serializers.CharField()
    category = serializers.CharField(required=False, allow_blank=True)
    href = serializers.CharField()
    thumbnail = serializers.CharField(required=False, allow_null=True)


class HeroSlideSerializer(serializers.Serializer):
    """Slides du carrousel Hero (Composant Slider)."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    excerpt = serializers.CharField(required=False, allow_blank=True)
    image = serializers.CharField()
    href = serializers.CharField()
    category = serializers.CharField(required=False, allow_blank=True)


class RepresentativeBlockSerializer(serializers.Serializer):
    """Composant Représentants."""
    name = serializers.CharField()
    role = serializers.CharField()
    photo_url = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)


class InstanceNewsSerializer(serializers.Serializer):
    """Composant Actualités des Instances Fil."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    date = serializers.CharField()
    type = serializers.CharField()
    href = serializers.CharField()


class FormFieldSerializer(serializers.Serializer):
    """Champs de formulaire (Composant Forms)."""
    id = serializers.CharField()
    clean_name = serializers.CharField()
    label = serializers.CharField()
    field_type = serializers.CharField()
    required = serializers.BooleanField()
    choices = serializers.CharField(required=False, allow_blank=True)
    help_text = serializers.CharField(required=False, allow_blank=True)
    default_value = serializers.CharField(required=False, allow_blank=True)


class TagSerializer(serializers.Serializer):
    """Tags (Page Archives — nuage de tags)."""
    name = serializers.CharField()


class RevendicationThemeSerializer(serializers.Serializer):
    """Thématiques de revendications (accordéons)."""
    id = serializers.CharField(source='block_id', required=False)
    title = serializers.CharField()
    short_title = serializers.CharField()
    icon_svg = serializers.CharField(required=False, allow_blank=True)
    content = serializers.ListField(child=serializers.CharField())
    pdf_url = serializers.CharField(required=False, allow_blank=True)


class ContactInfoSerializer(serializers.Serializer):
    """Coordonnées du siège (Page Contact)."""
    title = serializers.CharField()
    address_1 = serializers.CharField(required=False, allow_blank=True)
    address_2 = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    hours = serializers.CharField(required=False, allow_blank=True)


class InstitutionalLinkSerializer(serializers.Serializer):
    """Composant Boutons Liens."""
    label = serializers.CharField()
    href = serializers.URLField()
    icon = serializers.CharField()
    color = serializers.CharField()


class ActionCardSerializer(serializers.Serializer):
    """Composant Cards."""
    title = serializers.CharField()
    description = serializers.CharField()
    icon_name = serializers.CharField()
    link = serializers.CharField(required=False, allow_blank=True)
    link_text = serializers.CharField(required=False, allow_blank=True)


class NewsletterSerializer(serializers.Serializer):
    """Composant Newsletter."""
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    history_link = serializers.CharField(required=False, allow_blank=True)


class InstanceTypeSerializer(serializers.Serializer):
    """Types d'instance (filtres Page Instance)."""
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    color_class = serializers.CharField(required=False, allow_blank=True)


class InstanceArticleSerializer(serializers.Serializer):
    """Articles de la Page Instance."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    instance = serializers.CharField()
    instance_slug = serializers.CharField()
    date = serializers.CharField()
    excerpt = serializers.CharField(required=False, allow_blank=True)
    image = serializers.CharField(required=False, allow_blank=True)
    href = serializers.CharField()
```

---

## api.py — Configuration API & Endpoints

```python
# blog/api.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.models import Page

import json

# ─── API Router Wagtail ────────────────────────────────────────────────────

api_router = WagtailAPIRouter('wagtailapi')


class CustomPagesAPIViewSet(PagesAPIViewSet):
    """
    Expose toutes les pages avec leurs champs spécifiques.
    Paramètres de filtrage supplémentaires : sector, instance_type, tag.
    """
    known_query_parameters = PagesAPIViewSet.known_query_parameters.union([
        'sector', 'instance_type', 'tag',
    ])

    def get_queryset(self):
        qs = super().get_queryset()

        sector = self.request.query_params.get('sector')
        if sector:
            qs = qs.filter(articlepage__sector=sector)

        instance_type = self.request.query_params.get('instance_type')
        if instance_type:
            qs = qs.filter(articlepage__instance_type__slug=instance_type)

        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(articlepage__tags__name=tag)

        return qs


api_router.register_endpoint('pages', CustomPagesAPIViewSet)


# ─── GET /api/navigation/ ──────────────────────────────────────────────────

def navigation_api(request):
    """Retourne la navigation (topbar, main_nav, footer, social)."""
    from .models import HomePage, SectorPage

    sectors = SectorPage.objects.live().public().order_by('title')

    topbar = [
        {'title': 'Nos revendications', 'url': '/revendications', 'slug': 'revendications'},
        {'title': 'Instances', 'url': '/instances', 'slug': 'instances'},
        {'title': 'Contact', 'url': '/contact', 'slug': 'contact'},
    ]

    main_nav = [{'title': 'Accueil', 'url': '/', 'slug': 'accueil'}]
    for s in sectors:
        main_nav.append({'title': s.title, 'url': s.url, 'slug': s.slug})
    main_nav.extend([
        {'title': 'Archives', 'url': '/archives', 'slug': 'archives'},
        {'title': 'Instances', 'url': '/instances', 'slug': 'instances'},
        {'title': 'Revendications', 'url': '/revendications', 'slug': 'revendications'},
        {'title': 'Adhésion', 'url': '/adhesion', 'slug': 'adhesion', 'highlight': True},
    ])

    footer = [
        {'title': 'Mentions légales', 'url': '/mentions-legales', 'slug': 'mentions-legales'},
        {'title': 'Confidentialité', 'url': '/confidentialite', 'slug': 'confidentialite'},
        {'title': 'Plan du site', 'url': '/plan', 'slug': 'plan'},
    ]

    return JsonResponse({
        'topbar': topbar,
        'main_nav': main_nav,
        'footer': footer,
        'social': [],
    })


# ─── GET /api/settings/ ────────────────────────────────────────────────────

def settings_api(request):
    """Retourne les settings globaux du site (Footer, métadonnées)."""
    from wagtail.models import Site
    site = Site.objects.filter(is_default_site=True).first()

    return JsonResponse({
        'site_name': site.site_name if site else 'Follen',
        'site_tagline': None,
        'contact_email': 'contact@fsu.fr',
        'contact_phone': '01 43 63 31 31',
        'footer': {
            'about_title': 'À propos',
            'about_text': (
                'Follen est votre guide vers un mode de vie plus durable '
                "et respectueux de l'environnement."
            ),
            'links_title': 'Liens rapides',
            'contact_title': 'Contact',
            'address': 'Paris, France',
        },
    })


# ─── GET /api/sectors/<slug>/ ──────────────────────────────────────────────

def sector_detail_api(request, slug):
    """Retourne une SectorPage complète par slug."""
    from .models import SectorPage
    try:
        page = SectorPage.objects.live().public().get(slug=slug)
    except SectorPage.DoesNotExist:
        return JsonResponse({'error': 'Page secteur non trouvée'}, status=404)

    return JsonResponse({
        'id': page.pk,
        'title': page.title,
        'meta': {
            'type': 'blog.SectorPage',
            'slug': page.slug,
            'html_url': page.url,
            'first_published_at': (
                page.first_published_at.isoformat()
                if page.first_published_at else None
            ),
        },
        'color_theme': page.color_theme,
        'context_banner_text': page.context_banner_text,
        'sector_key': page.sector_key,
        'news_general_list': page.news_general_list,
        'news_instance_list': page.news_instance_list,
        'representatives_list': page.representatives_list,
        'actions': [
            {
                'type': block.block_type,
                'value': block.value,
                'id': block.id,
            }
            for block in page.actions
        ],
        'newsletter_title': page.newsletter_title,
        'newsletter_description': page.newsletter_description,
        'newsletter_history_link': page.newsletter_history_link,
    })


# ─── POST /api/v2/forms/submit/<page_id>/ ──────────────────────────────────

@csrf_exempt
def form_submit_api(request, page_id):
    """Soumet un formulaire Wagtail (Adhésion ou Contact)."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        page = Page.objects.get(pk=page_id).specific
    except Page.DoesNotExist:
        return JsonResponse({'error': 'Page non trouvée'}, status=404)

    if not hasattr(page, 'form_fields'):
        return JsonResponse(
            {'error': "Cette page n'est pas un formulaire"}, status=400,
        )

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON invalide'}, status=400)

    # Validation
    errors = {}
    form_fields = page.form_fields.all()

    for field in form_fields:
        value = data.get(field.clean_name, '')
        if field.required and not value:
            errors[field.clean_name] = [
                f'Le champ "{field.label}" est obligatoire.'
            ]
        if field.field_type == 'email' and value:
            import re
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', value):
                errors[field.clean_name] = ['Adresse email invalide.']

    if errors:
        return JsonResponse({
            'success': False,
            'message': 'Erreurs de validation',
            'errors': errors,
        }, status=400)

    # Enregistrement
    form_submission_class = page.get_submission_class()
    form_submission_class.objects.create(
        form_data=json.dumps(data, ensure_ascii=False),
        page=page,
    )

    thank_you = getattr(
        page, 'thank_you_text', 'Formulaire soumis avec succès.',
    )

    return JsonResponse({
        'success': True,
        'message': thank_you,
    })


# ─── POST /api/newsletter/ ─────────────────────────────────────────────────

@csrf_exempt
def newsletter_subscribe_api(request):
    """Inscrit un email à la newsletter."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON invalide'}, status=400)

    email = data.get('email', '').strip()
    if not email:
        return JsonResponse({
            'success': False,
            'message': "L'adresse email est requise.",
        }, status=400)

    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({
            'success': False,
            'message': 'Adresse email invalide.',
        }, status=400)

    # TODO: Enregistrer dans NewsletterSubscription
    # ou envoyer à un service tiers (Mailchimp, Brevo, etc.)

    return JsonResponse({
        'success': True,
        'message': 'Inscription réussie !',
    })
```

---

## urls.py — Routage

```python
# blog/urls.py (ou urls.py du projet)
from django.urls import path, include
from .api import (
    api_router,
    navigation_api,
    settings_api,
    sector_detail_api,
    form_submit_api,
    newsletter_subscribe_api,
)

urlpatterns = [
    # API Wagtail v2 standard
    path('api/v2/', api_router.urls),

    # Endpoints custom
    path('api/navigation/', navigation_api, name='api-navigation'),
    path('api/settings/', settings_api, name='api-settings'),
    path('api/sectors/<slug:slug>/', sector_detail_api, name='api-sector-detail'),
    path('api/v2/forms/submit/<int:page_id>/', form_submit_api, name='api-form-submit'),
    path('api/newsletter/', newsletter_subscribe_api, name='api-newsletter'),
]
```

---

## Notes d'implémentation

### Dépendances Python requises

```
wagtail>=6.0
djangorestframework
django-modelcluster
django-taggit
```

### Ordre de mise en place

1. Créer `blog/blocks.py`
2. Créer `blog/serializers.py`
3. Créer / mettre à jour `blog/models.py`
4. Créer `blog/api.py`
5. Mettre à jour `urls.py` du projet
6. `python manage.py makemigrations blog`
7. `python manage.py migrate`
8. Créer les snippets `ArticleCategory` et `InstanceType` dans l'admin Wagtail
9. Créer l'arbre de pages (HomePage > SectorPages, ArticlePages, etc.)

### Points d'attention

- Les `@property` sur les modèles font le gros du travail de sérialisation. Wagtail expose automatiquement ce qui est déclaré dans `api_fields`.
- Les StreamField blocks sont automatiquement sérialisés en JSON par Wagtail — pas besoin de serializer DRF supplémentaire pour eux.
- Les serializers DRF servent de documentation/validation pour les vues custom et les tests.
- **Pagefind** ne nécessite aucune modification backend : il indexe le HTML statique généré par Astro.
- Les `header_image_url` et `header_image_thumbnail` sont des propriétés calculées qui renvoient directement des URLs exploitables par le frontend, sans passer par l'API Images de Wagtail.
